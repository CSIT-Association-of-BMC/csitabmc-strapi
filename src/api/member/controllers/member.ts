import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::member.member",
  ({ strapi }) => ({
    async findOne(ctx) {
      const memberId = ctx.params.id;

      const populate = ctx.query.populate || {};

      try {
        const result = await strapi.entityService.findMany(
          "api::member.member",
          {
            filters: { memberId },
            limit: 1,
            populate,
          }
        );

        if (!result || result.length === 0) {
          return ctx.notFound("Member not found");
        }

        // Maintain standard response format
        return this.transformResponse(result[0]);
      } catch (err) {
        ctx.internalServerError("Something went wrong");
      }
    },
  })
);
